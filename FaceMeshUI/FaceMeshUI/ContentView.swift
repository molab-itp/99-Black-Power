//
//  ContentView.swift
//  FaceMeshUI
//
//  Created by jht2 on 10/16/26.
//

import SwiftUI

struct ContentView: View {
    @State private var tracker = FaceTracker()
    @State private var layers = FaceLayers()

    var body: some View {
        ZStack(alignment: .bottom) {
            if tracker.isSupported {
                FaceViewAR(tracker: tracker, layers: layers)
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
                HStack {
                    layerToggle("Video", systemImage: "video", isOn: $layers.showVideo)
                    layerToggle("Mesh", systemImage: "circle.grid.cross", isOn: $layers.showMesh)
                    layerToggle("Color", systemImage: "triangle.fill", isOn: $layers.showColoredTriangles)
                }
                .padding(.top, 4)
            }
            .foregroundStyle(.white)
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
            .padding()
        }
    }

    private func layerToggle(_ title: String, systemImage: String, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            Label(title, systemImage: systemImage)
        }
        .toggleStyle(.button)
        .tint(.cyan)
    }
}

#Preview {
    ContentView()
}
