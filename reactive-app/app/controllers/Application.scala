package controllers

import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.libs.iteratee.{Iteratee, Concurrent, Enumerator}
import play.api.mvc._
import java.util.Date
import models.Ping
import concurrent.ExecutionContext
import ExecutionContext.Implicits.global

object Application extends Controller {
  val LOGGER = play.api.Logger("APPLICATION")

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }


  /*
  * The minimum json expected
  * {
  *   uuid : "",
  *   time : 1234,
  *   position: "lat,lng"
  * }
  *
  * */
  def init = WebSocket.using[String] { request=>
    val id = request.getQueryString("uuid").getOrElse("empty")
    val e = Rooms.enter(id)
    val i = Iteratee.foreach[String] { s =>
        val json = Json.parse(s)
        json.transform(pingRead).map { js =>
          Ping.insert(json).map { err =>
            Rooms.pong(id, Json.obj("echo" -> js, "timestamp" -> new Date().getTime, "uuid" -> id))
          }
        }.recoverTotal{ err =>
          val r: JsObject = JsError.toFlatJson(err)
          println(r)
          Rooms.pong(id,r)
        }
    }
    (i,e)
  }

  def stream(id: String) = Action {
    Async {
      val pings = Ping.byUUID(id)    
      pings.map { p =>
        Ok(Json.stringify(p))
      }
      
    }
  }

  def show = Action(request => Ok(views.html.show()))
  def latest = Action(Async(Ping.lastest.map(Ok(_))))

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
  //def ping(uuid:String)

}