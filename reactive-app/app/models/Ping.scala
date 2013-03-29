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
    collection.find[JsValue]( qb ).toList(50).map { pings =>
      pings.foldLeft(JsArray(List()))((obj, ping) => obj ++ Json.arr(ping))
    }
  }

  def latest(uuids:Set[String]) = {
    val q = BSONDocument("uuid" -> BSONDocument("$in" -> BSONArray(uuids.map(s => BSONString(s)).toSeq: _*)))
    collection.find[JsValue](QueryBuilder().sort("time"->SortOrder.Descending).query(q)).toList.map { pings =>
      pings.groupBy(j => (j\"uuid").as[String])
        .map(t => t._1 -> t._2.head)
        .foldLeft(JsArray(List()))((r, i) => r ++ Json.arr(Json.obj("uuid"-> i._1, "position" -> i._2 \ "position" , "latency" -> i._2 \ "latency")))
    }
  }

}
