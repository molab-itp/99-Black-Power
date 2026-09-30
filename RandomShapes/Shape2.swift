//
//  Shape2.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/11/24.
//

import SwiftUI

struct Shape2: View {
  var body: some View {
    VStack {
      Text("Shape2").font(.largeTitle).bold()
      Image(uiImage: renderArcs(CGFloat.pi))
    }
  }
}

#Preview {
  Shape2()
}

func renderArcs(_ astartAngle: CGFloat,
                width:Int = 400,
                height:Int = 400) -> UIImage {
  let sz = CGSize(width: width, height: height)
  let renderer = UIGraphicsImageRenderer(size: sz)
  let image = renderer.image { context in
    let cgx = context.cgContext
    let box = renderer.format.bounds
    var ibox = CGRect(x: 0, y: 0, width: box.width, height: box.width)
    
    UIColor.black.setFill()
    cgx.addEllipse(in: ibox)
    cgx.drawPath(using: .fillStroke)
    
    let center = CGPoint(x:box.width/2, y:box.height/2)
    let radius = box.width/2;
    let deltaAngle = CGFloat.pi * 2 / 3
    let marginAngle = deltaAngle / 10
    var startAngle = astartAngle - CGFloat.pi / 2 + marginAngle / 2
    var endAngle = startAngle + deltaAngle
    
    UIColor.red.setFill()
    cgx.move(to: center)
    cgx.addArc(center: center, radius: radius,
               startAngle: startAngle,
               endAngle: endAngle-marginAngle, clockwise: false)
    cgx.drawPath(using: .fillStroke )
    
    UIColor.green.setFill()
    startAngle += deltaAngle
    endAngle += deltaAngle
    cgx.move(to: center)
    cgx.addArc(center: center, radius: radius,
               startAngle: startAngle,
               endAngle: endAngle-marginAngle, clockwise: false)
    cgx.drawPath(using: .fillStroke )
    
    UIColor.gold.setFill()
    startAngle += deltaAngle
    endAngle += deltaAngle
    cgx.move(to: center)
    cgx.addArc(center: center, radius: radius,
               startAngle: startAngle,
               endAngle: endAngle-marginAngle, clockwise: false)
    cgx.drawPath(using: .fillStroke )
    
    let dx = box.width / 3.5
    ibox = ibox.insetBy(dx: dx, dy: dx)
    UIColor.black.setFill()
    cgx.addEllipse(in: ibox)
    cgx.drawPath(using: .fillStroke)
  }
  return image;
}


// how do draw a pie circle segment using swift CGContext
// https://chat.openai.com/share/267d2d8e-e634-4dfc-a5ab-4ab317a25cbd

class PieView: UIView {
  
  override func draw(_ rect: CGRect) {
    // Set up the graphics context
    guard let context = UIGraphicsGetCurrentContext() else { return }
    
    // Center point of the circle
    let center = CGPoint(x: rect.width / 2, y: rect.height / 2)
    
    // Radius of the circle
    let radius: CGFloat = min(rect.width, rect.height) / 2
    
    // Start angle and end angle of the segment (in radians)
    let startAngle: CGFloat = CGFloat.pi / 4 // Adjust as needed
    let endAngle: CGFloat = CGFloat.pi * 3 / 4 // Adjust as needed
    
    // Draw the circle segment
    context.move(to: center)
    context.addArc(center: center, radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: false)
    context.closePath()
    
    // Set the fill color and fill the segment
    UIColor.blue.setFill() // Change the color as needed
    context.fillPath()
  }
}


