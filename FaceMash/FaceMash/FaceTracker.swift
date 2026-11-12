//
//  FaceTracker.swift
//  FaceMash
//

import ARKit
import Observation

/// Holds face-tracking state reported by ARKit for display in SwiftUI.
@Observable
final class FaceTracker {
    var isSupported = ARFaceTrackingConfiguration.isSupported
    var faceDetected = false

    var smile: Float = 0       // 0...1, average of left/right mouth smile
    var blinkLeft: Float = 0   // 0...1, user's left eye
    var blinkRight: Float = 0  // 0...1, user's right eye

    // Thresholds for treating a blend-shape value as "on"
    var smileThreshold: Float = 0.5
    var blinkThreshold: Float = 0.5

    // Completed blinks (both eyes) and smiles, with how long each lasted.
    var blinks = EventCounter()
    var smiles = EventCounter()

    var isSmiling: Bool { faceDetected && smile > smileThreshold }
    var isBlinkingLeft: Bool { faceDetected && blinkLeft > blinkThreshold }
    var isBlinkingRight: Bool { faceDetected && blinkRight > blinkThreshold }

    var status: String {
        guard isSupported else { return "Face tracking not supported on this device" }
        guard faceDetected else { return "No face detected" }
        var parts: [String] = []
        if isSmiling { parts.append("Smiling") }
        switch (isBlinkingLeft, isBlinkingRight) {
        case (true, true): parts.append("Blinking")
        case (true, false): parts.append("Winking left")
        case (false, true): parts.append("Winking right")
        default: break
        }
        return parts.isEmpty ? "Neutral" : parts.joined(separator: " + ")
    }

    func update(blendShapes: [ARFaceAnchor.BlendShapeLocation: NSNumber]) {
        let smileL = blendShapes[.mouthSmileLeft]?.floatValue ?? 0
        let smileR = blendShapes[.mouthSmileRight]?.floatValue ?? 0
        smile = (smileL + smileR) / 2
        blinkLeft = blendShapes[.eyeBlinkLeft]?.floatValue ?? 0
        blinkRight = blendShapes[.eyeBlinkRight]?.floatValue ?? 0
        faceDetected = true
        blinks.update(isOn: isBlinkingLeft && isBlinkingRight)
        smiles.update(isOn: isSmiling)
    }

    /// Clears the blink and smile counts and durations.
    func resetStats() {
        blinks = EventCounter()
        smiles = EventCounter()
    }

    func faceLost() {
        faceDetected = false
        smile = 0
        blinkLeft = 0
        blinkRight = 0
        // A blink or smile in progress when the face is lost is not counted.
        blinks.cancel()
        smiles.cancel()
    }
}

/// Counts how many times a state turns on and off, and how long it stays on.
struct EventCounter {
    private(set) var count = 0
    private(set) var totalDuration: TimeInterval = 0
    private var start: Date?

    /// Average duration in seconds of completed events, 0 if none.
    var averageDuration: TimeInterval { count > 0 ? totalDuration / Double(count) : 0 }

    mutating func update(isOn: Bool, at time: Date = .now) {
        if isOn {
            if start == nil { start = time }
        } else if let start {
            count += 1
            totalDuration += time.timeIntervalSince(start)
            self.start = nil
        }
    }

    mutating func cancel() { start = nil }
}
