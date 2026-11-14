import UIKit
import GoogleMaps

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    GMSServices.provideAPIKey("AIzaSyDXPITzCMC0m54c-5b39CGjFRpIlnmJeo8")
    true
  }
}
