package controllers

import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.libs.iteratee.{Enumeratee, Iteratee, Concurrent, Enumerator}
import play.api.mvc._
import java.util.Date
import models.Ping
import concurrent.{Future, ExecutionContext}
import ExecutionContext.Implicits.global
import concurrent.duration.Duration
import scala.concurrent.duration._
import play.api.libs.iteratee._

object Application extends Controller {
  val LOGGER = play.api.Logger("APPLICATION")
  val (broadcastToMap, channelToMap) = play.api.libs.iteratee.Concurrent.broadcast[JsValue]

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }


  /*
  * The minimum json expected
  * {
  *   uuid : "",
  *   latency : 1234,
  *   position: "lat,lng"
  * }
  *
  * */
  def init = WebSocket.using[String] { request=>
    val id = request.getQueryString("uuid").getOrElse(throw new IllegalStateException("You must pass a uuid"))
    val e = Rooms.enter(id)
    val i = Iteratee.foreach[String] { s =>
        val json = Json.parse(s)
        json.transform(pingRead)
          .map { js =>
            channelToMap.push(js)
            Rooms.pong(id, Json.obj("echo" -> js, "timestamp" -> new Date().getTime, "uuid" -> id))
          }
          .recoverTotal{ err =>
            val r: JsObject = JsError.toFlatJson(err)
            println(r)
            Rooms.pong(id,r)
          }
    }
    (broadcastToMap &> average(1 second)).run(Iteratee.foreach[JsValue](Ping.insert(_)))
    (i,e)
  }

  def mapStream = Action({
    Ok.feed(
      broadcastToMap &> play.api.libs.EventSource()
    ).as("text/event-stream")
  })

  def folder(d:Duration) = Iteratee.fold2[JsValue,(Option[Long], List[JsValue])]((None:Option[Long], List[JsValue]())){
    case x @ ((t,els),e) => {
      val now = new Date().getTime
      val current = t.getOrElse(now)
      val done = now - current >= d.toMillis
      Future.successful(((Some(current), e :: els),done))
    }
  }

  def average(d:Duration):Enumeratee[JsValue,JsValue] = Enumeratee.grouped(folder(d).map{ case (_,l) =>
    val averageLatency = l.map(x => (x \ "latency").as[Float]).sum / l.size
    def transformer = __.json.update((__ \ "latency").json.put(JsNumber(averageLatency)))
    l.headOption
      .flatMap( _.validate(transformer).asOpt)
      .map(_ ++ Json.obj("time"-> new Date().getTime))
      .getOrElse(JsNull)
  })

  def forUser(id:String) = Enumeratee.filter[JsValue](j => (j \ "uuid").as[String] == id)

  def chartStream(id:String) = Action{
    Ok.feed(broadcastToMap &> forUser(id) &> average(1 second) &> play.api.libs.EventSource())
      .as("text/event-stream")
  }

  def chartHistory(id: String) = Action {
    Async {
      val pings = Ping.byUUID(id)    
      pings.map { p =>
        Ok(Json.stringify(p))
      }
    }
  }

  def show = Action(request => Ok(views.html.show()))
  def chart(id:String) = Action(Ok(views.html.chart(id)))
  def latest = {
    val online = Rooms.clients.map(_._1).toSet
    Action(Async(Ping.latest(online).map(Ok(_))))
  }

  val pingRead = Reads{ js => JsSuccess(js) } keepAnd ((__ \ "position").read[String] and
                 (__ \ "uuid").read[String] and
                 (__ \ "latency").read[Float]).tupled
}

object Rooms {
  var clients = Map[String, Concurrent.Channel[String]]()

  def enter(uuid:String): Enumerator[String] = {
    val e = Concurrent.unicast[String]( channel => {
      clients += (uuid -> channel)
      println("New client "+uuid)
    }, () => clients = clients - uuid)
    e
  }

  def pong(uuid:String, s:JsValue) = {
    clients(uuid).push(Json.stringify(s))
  }
}
