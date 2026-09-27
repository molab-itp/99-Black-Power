//
//  BllackPower.swift
//  Black-Power
//
//  Created by jht2 on 9/27/26.
//

import SwiftUI

struct BllackPower: View {
    var body: some View {
      Text("Black Power taking up space")
        .font(.system(size: 28))
        .bold()
      BlackPowerCanvasView(startingAngle: .pi)
      Text("...more")
        .font(.largeTitle)
    }
}

#Preview {
    BllackPower()
}

struct BlackPowerCanvasView: View {
  var startingAngle: CGFloat
  var body: some View {
    Canvas { context, size in
      drawBlackPower(context: context,
                     size: size,
                     startingAngle: startingAngle)
    }
  }
}

func drawBlackPower(
  context: GraphicsContext,
  size: CGSize,
  startingAngle: CGFloat )
{
  let dim: CGFloat = min(size.width, size.height)
  let size: CGSize = .init(width: dim, height: dim)
  let box = CGRect(origin: .zero, size: size)
  let center = CGPoint(x: box.midX, y: box.midY)
  let radius = box.width / 2
  let deltaAngle = Double.pi * 2 / 3
  let marginAngle = deltaAngle / 10
  var startAngle = startingAngle - CGFloat.pi / 2 + marginAngle / 2
  var endAngle = startAngle + deltaAngle
  
  // Draw outer black circle
  context.fill(
    Path(ellipseIn: box),
    with: .color(.black)
  )
  
  // Draw red segment
  context.fill(
    segmentPath(center: center, radius: radius,
                startAngle: startAngle, endAngle: endAngle - marginAngle),
    with: .color(.red)
  )
  
  // Draw green segment
  startAngle += deltaAngle
  endAngle += deltaAngle
  context.fill(
    segmentPath(center: center, radius: radius,
                startAngle: startAngle, endAngle: endAngle - marginAngle),
    with: .color(.green)
  )
  
  // Draw gold segment
  startAngle += deltaAngle
  endAngle += deltaAngle
  context.fill(
    segmentPath(center: center, radius: radius,
                startAngle: startAngle, endAngle: endAngle - marginAngle),
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

// Helper function to create a pie-slice path
private func segmentPath(center: CGPoint, radius: CGFloat, startAngle: Double, endAngle: Double) -> Path {
  var path = Path()
  path.move(to: center)
  path.addArc(center: center, radius: radius,
              startAngle: .radians(startAngle),
              endAngle: .radians(endAngle),
              clockwise: false)
  return path
}

// Convert code to use SwiftUI Canvas
// https://chatgpt.com/share/67aa8daa-4f1c-8002-b515-e4a1758c38a8

import UIKit

extension UIColor {
  static var gold: UIColor { // Computed property
    UIColor(red: 1, green: 215.0/255.0, blue: 0.0, alpha: 1)
  }
}
// https://color-term.com/color/gold-ffd700/
// 255, 215, 0
// https://color-term.com/color/lego-chrome-gold-bba53d/
// RGB(187, 165, 61) // Chrome Gold

extension Color {
  static var gold: Color {
    .init(UIColor.gold)
  }
}



