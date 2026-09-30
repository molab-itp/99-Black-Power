//
//  Shape2a.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/10/25.
//
// Canvas version of Shape2

import SwiftUI

struct Shape2_Canvas: View {
  var body: some View {
    VStack {
      Text("Shape2_Canvas").font(.largeTitle).bold()
      // Image(uiImage: renderShape2(0.0))
      Shape2View(astartAngle: CGFloat.pi)
    }
  }
}

#Preview {
  Shape2_Canvas()
}

struct Shape2View: View {
  var astartAngle: CGFloat
  var body: some View {
    Canvas { context, size in
      let box = CGRect(origin: .zero, size: size)
      let center = CGPoint(x: box.midX, y: box.midY)
      let radius = box.width / 2
      let deltaAngle = Double.pi * 2 / 3
      let marginAngle = deltaAngle / 10
      var startAngle = astartAngle - CGFloat.pi / 2 + marginAngle / 2
      var endAngle = startAngle + deltaAngle
      
      // Draw outer black circle
      context.fill(
        Path(ellipseIn: box),
        with: .color(.black)
      )
      
      // Draw red segment
      context.fill(
        segmentPath(center: center, radius: radius, startAngle: startAngle, endAngle: endAngle - marginAngle),
        with: .color(.red)
      )
      
      // Draw green segment
      startAngle += deltaAngle
      endAngle += deltaAngle
      context.fill(
        segmentPath(center: center, radius: radius, startAngle: startAngle, endAngle: endAngle - marginAngle),
        with: .color(.green)
      )
      
      // Draw gold segment
      startAngle += deltaAngle
      endAngle += deltaAngle
      context.fill(
        segmentPath(center: center, radius: radius, startAngle: startAngle, endAngle: endAngle - marginAngle),
        with: .color(.gold) 
      )
      
      // Draw inner black circle
      let dx = box.width / 3.5
      let ibox = box.insetBy(dx: dx, dy: dx)
      context.fill(
        Path(ellipseIn: ibox),
        with: .color(.black)
      )
    }
    .frame(width: 400, height: 400)
  }
  
  /// Helper function to create a pie-slice path
  private func segmentPath(center: CGPoint, radius: CGFloat, startAngle: Double, endAngle: Double) -> Path {
    var path = Path()
    path.move(to: center)
    path.addArc(center: center, radius: radius,
                startAngle: .radians(startAngle),
                endAngle: .radians(endAngle),
                clockwise: false)
    return path
  }
}

// Convert code to use SwiftUI Canvas
// https://chatgpt.com/share/67aa8daa-4f1c-8002-b515-e4a1758c38a8


