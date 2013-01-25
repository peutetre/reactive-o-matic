package controllers

import play.api._
import libs.iteratee.{Enumeratee, Iteratee, Concurrent, Enumerator}
import libs.json.{JsString, JsValue, Json}
import play.api.mvc._
import java.util.Date


object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def init = WebSocket.using[String] { request=>
    val id = request.getQueryString("uuid").getOrElse("empty")
    val e = Rooms.enter(id)
    val i = Iteratee.foreach[String](s => {
      println(s)
      Rooms.pong(id, Json.obj( "echo" -> s, "timestamp" -> new Date().getTime, "uuid" -> id))
    })
    (i,e)
  }
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