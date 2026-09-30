//
//  Shape4.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/11/24.
//

import SwiftUI

struct Shape5: View {
  @State var uiImage:UIImage = renderColorGrid();
  var body: some View {
    VStack {
      Text("Shape5").font(.largeTitle).bold()
      Image(uiImage: uiImage)
      //            Button(action: buttonAction) {
      //                Text("Next")
      //            }
      Button("Shuffle") {
        buttonAction()
      }
      .font(.largeTitle).bold()
    }
    .onAppear {
      randomColorIndex();
    }
  }
  
  func buttonAction() {
    randomColorIndex();
    uiImage = renderColorGrid()
  }
}

#Preview {
  Shape5()
}

func renderColorGrid() -> UIImage {
  let width = 400
  let height = 400
  let sz = CGSize(width: width, height: height)
  let renderer = UIGraphicsImageRenderer(size: sz)
  let image = renderer.image { context in
    let cgx = context.cgContext
    let box = renderer.format.bounds
    let ibox = CGRect(x: 0, y: 0, width: box.width, height: box.width)
    
    UIColor.black.setFill()
    cgx.addEllipse(in: ibox)
    cgx.drawPath(using: .fillStroke)
    
    var x = 0.0
    var y = 0.0;
    let w = 50.0;
    let h = 50.0;
    
    while true {
      
      // nextColor().setFill();
      if let color = myColors.randomElement() {
        color.setFill();
      }
      
      context.fill( CGRect(x: x, y: y, width: w, height: h) )
      
      x = x + w;
      if (x > ibox.width) {
        x = 0
        y += h
        if (y > ibox.height) {
          break;
        }
      }
    }
    
  }
  return image;
}

var myColors = [UIColor.black, UIColor.red, UIColor.green, UIColor.gold]
var myColorIndex = 0

func randomColorIndex() {
  myColorIndex = Int.random(in: 0 ..< myColors.count)
  myColors.shuffle()
}

func nextColor() -> UIColor {
  let ncolor = myColors[myColorIndex];
  myColorIndex = (myColorIndex + 1) % myColors.count;
  return ncolor
}
