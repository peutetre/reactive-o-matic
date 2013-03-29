/**
 * User: ala
 * Date: 29/03/13
 * Time: 14:32
 */

import play.api._

object Global extends GlobalSettings {

  override def onStart(app: Application) {
    import play.modules.reactivemongo.ReactiveMongoPlugin
    import concurrent.ExecutionContext
    import reactivemongo.api.indexes._
    import reactivemongo.api.indexes.IndexType._
    import ExecutionContext.Implicits.global

    implicit val _ = app
    val db = ReactiveMongoPlugin.db
    lazy val collection = db("pings")
    collection.indexesManager.ensure(Index(List("time"-> Ascending)))

    Logger.info("Application has started")
  }

  override def onStop(app: Application) {
    Logger.info("Application shutdown...")
  }

}