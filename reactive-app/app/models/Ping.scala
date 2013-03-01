package models

import reactivemongo.api._
import reactivemongo.bson._
import reactivemongo.bson.handlers.DefaultBSONHandlers._
import concurrent.{ExecutionContext, Future}
import play.modules.reactivemongo._
import play.modules.reactivemongo.PlayBsonImplicits._
import play.api.libs.json._
import play.api.Play.current
import ExecutionContext.Implicits.global
import java.util.Date

object Ping {
  val db = ReactiveMongoPlugin.db
  lazy val collection = db("pings")


  /*
  *
  * {
  *   uuid : "",
  *   latency : 1234,
  *   position: "lat,lng"
  * }
  *
  * */
  def insert(ping:JsValue) = collection.insert[JsValue](ping.asInstanceOf[JsObject] ++ Json.obj("time"->JsNumber(new Date().getTime)))

  def byUUID(uuid:String):Future[JsArray] = {
    val qb = QueryBuilder().query(Json.obj( "uuid" -> uuid )).sort( "time" -> SortOrder.Ascending)
    collection.find[JsValue]( qb ).toList.map { pings =>
      pings.foldLeft(JsArray(List()))((obj, ping) => obj ++ Json.arr(ping))
    }
  }

  def lastest = {
    collection.find[JsValue](QueryBuilder().query(BSONDocument())).toList.map { pings =>
      pings.groupBy(_\"uuid").map{ case (uuid, ps) =>
        (uuid.as[String] , ps.sortBy( v => (v \ "time").as[Long]).headOption)
      }.filter(_._2.isDefined)
       .foldLeft(JsArray(List()))((r, i) => r ++ Json.arr(Json.obj("uuid"-> i._1, "position" -> i._2.get \ "position" , "latency" -> i._2.get \ "latency")))
    }
  }

}
