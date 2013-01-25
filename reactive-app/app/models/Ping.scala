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

object Ping {
  val db = ReactiveMongoPlugin.db
  lazy val collection = db("pings")

  def insert(ping:JsValue) = collection.insert[JsValue](ping)

  def byUUID(uuid:String):Future[JsArray] = {
    val qb = QueryBuilder().query(Json.obj( "uuid" -> uuid )).sort( "time" -> SortOrder.Ascending)
    collection.find[JsValue]( qb ).toList.map { pings =>
      pings.foldLeft(JsArray(List()))((obj, ping) => obj ++ Json.arr(ping))
    }
  }

}
