//
//  Graphics.swift
//  Week04-RandomShapes
//
//  Created by jht2 on 2/11/24.
//

import UIKit

extension UIColor {
//    static var gold = UIColor(red: 187/255.0,
//                              green: 165/255.0,
//                              blue: 61/255.0,
//                              alpha: 1)
        static var gold: UIColor { // Computed property
            UIColor(red: 1, green: 215.0/255.0, blue: 0.0, alpha: 1)
        }
}

// 255, 215, 0

// RGB(187, 165, 61)
// Chrome Gold
// https://color-term.com/color/lego-chrome-gold-bba53d/

import SwiftUI

extension Color {
  static var gold: Color {
    .init(UIColor.gold)
  }
}
