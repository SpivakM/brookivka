import UIKit
import GoogleMaps
import RNCConfig

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if let mapsApiKey = RNCConfig.env(for: "GOOGLE_MAPS_API_KEY"), !mapsApiKey.isEmpty {
      GMSServices.provideAPIKey(mapsApiKey)
    } else {
      NSLog("GOOGLE_MAPS_API_KEY is not configured; Google Maps will be unavailable.")
    }
    true
  }
}
