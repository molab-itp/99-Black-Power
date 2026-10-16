//
//  ContentView.swift
//  FaceMeshUI
//
//  Created by jht2 on 10/16/26.
//

import SwiftUI

struct ContentView: View {
    @State private var tracker = FaceTracker()

    var body: some View {
        ZStack(alignment: .bottom) {
            if tracker.isSupported {
                FaceViewAR(tracker: tracker)
                    .ignoresSafeArea()
            } else {
                Color.black.ignoresSafeArea()
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(tracker.status)
                    .font(.title2.bold())
                if tracker.faceDetected {
                    Text(String(format: "smile %.2f   blink L %.2f   blink R %.2f",
                                tracker.smile, tracker.blinkLeft, tracker.blinkRight))
                        .font(.caption.monospacedDigit())
                }
            }
            .foregroundStyle(.white)
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
            .padding()
        }
    }
}

#Preview {
    ContentView()
}
