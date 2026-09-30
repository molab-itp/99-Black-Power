//
//  renderGraphics.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/11/24.
//

import UIKit

// reference code for using UIGraphicsImageRenderer
//
// from https://github.com/molab-itp/01-UIRender-playground

func renderGraphics(width:Int, height:Int) -> UIImage {
  print("renderGraphics width=\(width) height=\(height)")
  let len = width / 4;
  let hi = height;
  let sz = CGSize(width: width, height: height)
  let renderer = UIGraphicsImageRenderer(size: sz)
  let image = renderer.image { context in
    UIColor.red.setFill()
    context.fill(CGRect(x: 0, y: 0, width: len, height: hi))
    UIColor.green.setFill()
    context.fill(CGRect(x: len, y: 0, width: len, height: hi))
    UIColor.yellow.setFill()
    context.fill(CGRect(x: len*2, y: 0, width: len, height: hi))
    UIColor.black.setFill()
    context.fill(CGRect(x: len*3, y: 0, width: len, height: hi))
    UIColor.darkGray.setStroke()
    context.stroke(renderer.format.bounds)
    var box = renderer.format.bounds
    for _ in 0...5 {
      box = box.insetBy(dx: 4, dy: 4)
      context.stroke(box)
    }
    // UIColor(red: 158/255, green: 215/255, blue: 245/255, alpha: 1).setFill()
  }
  return image;
}
