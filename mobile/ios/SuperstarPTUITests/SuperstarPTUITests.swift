import XCTest

final class SuperstarPTUITests: XCTestCase {
  override func setUpWithError() throws {
    continueAfterFailure = false
  }

  func testAdaptiveCheckInFlowCapturesScreenshots() throws {
    let app = XCUIApplication()
    app.launch()

    let title = app.staticTexts["screen-home-title"]
    XCTAssertTrue(title.waitForExistence(timeout: 20), "Expected home title to render")
    captureScreenshot(named: "home")

    let highReadiness = app.descendants(matching: .any)["btn-readiness-high"]
    XCTAssertTrue(highReadiness.waitForExistence(timeout: 10), "Expected high readiness button")
    highReadiness.tap()

    let actionLabel = app.staticTexts["result-action-label"]
    XCTAssertTrue(actionLabel.waitForExistence(timeout: 10), "Expected recommendation action label")
    XCTAssertTrue(
      actionLabel.label.contains("progress"),
      "Expected action label to contain 'progress', got: \(actionLabel.label)"
    )
    captureScreenshot(named: "after_high_readiness")

    let mainScroll = app.descendants(matching: .any)["main-scroll"]
    XCTAssertTrue(mainScroll.waitForExistence(timeout: 10), "Expected main scroll container")
    mainScroll.swipeUp()
    captureScreenshot(named: "after_swipe")
  }

  private func captureScreenshot(named name: String) {
    let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    attachment.name = name
    attachment.lifetime = .keepAlways
    add(attachment)
  }
}
