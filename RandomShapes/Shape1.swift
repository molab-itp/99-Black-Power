//
//  Shape1.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/11/24.
//

import SwiftUI

// GeometryReader for getting screen size
// where is renderGraphics defined?

struct Shape1: View {
  var body: some View {
    GeometryReader { geo in
      VStack {
        Text("Shape1").font(.largeTitle).bold()
        
        Image(uiImage:
                renderCircles(
                  width: geo.size.width,
                  height: geo.size.height/2))
        Image(uiImage:
                renderGraphics(
                  width: Int(geo.size.width),
                  height: Int(geo.size.height/3)))
      }
    }
  }
}

#Preview {
  Shape1()
}


// source https://github.com/molab-itp/03-UIGraphics-View
// source https://github.com/molab-itp/01-UIRender-playground

// where is UIColor.gold defined?

func renderCircles(width: CGFloat, height: CGFloat) -> UIImage {
  //    let width = 400
  //    let height = 400
  let sz = CGSize(width: width, height: height)
  let renderer = UIGraphicsImageRenderer(size: sz)
  let image = renderer.image { context in
    let box = renderer.format.bounds
    var ibox = CGRect(x: 0, y: 0, width: box.width, height: box.width)
    UIColor.black.setFill()
    context.cgContext.fillEllipse(in: ibox)
    let dx = box.width / 8
    ibox = ibox.insetBy(dx: dx, dy: dx)
    UIColor.red.setFill()
    context.cgContext.fillEllipse(in: ibox)
    ibox = ibox.insetBy(dx: dx, dy: dx)
    UIColor.green.setFill()
    context.cgContext.fillEllipse(in: ibox)
    ibox = ibox.insetBy(dx: dx, dy: dx)
    //        UIColor.yellow.setFill()
    //        UIColor(red: 1, green: 215.0/255.0, blue: 0.0, alpha: 1).setFill()
    UIColor.gold.setFill()
    context.cgContext.fillEllipse(in: ibox)
  }
  return image;
}



/*
 GeometryReader { geo in
 geo.size.width
 geo.size.height
 }
 function (geo) {
 let w = geo.size.width
 let h = geo.size.height
 }
 
 */

// https://www.hackingwithswift.com/books/ios-swiftui/understanding-frames-and-coordinates-inside-geometryreader

//GeometryReader { geo in
//    Text("Hello, World!")
//        .frame(width: geo.size.width * 0.9)
//        .background(.red)
//}
