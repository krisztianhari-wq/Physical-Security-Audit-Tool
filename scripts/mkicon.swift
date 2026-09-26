// Draws the app icon (1024x1024 PNG): sadrobot blue tile, white shield with a check mark, "sr" mark.
// Usage: swift scripts/mkicon.swift out.png [padFraction]   (padFraction > 0 shrinks the drawing, e.g. 0.18 for Android)
import AppKit
let args = CommandLine.arguments
let out = args.count > 1 ? args[1] : "icon.png"
let pad = args.count > 2 ? CGFloat(Double(args[2]) ?? 0) : 0
let S: CGFloat = 1024
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(S), pixelsHigh: Int(S), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let ctx = NSGraphicsContext.current!.cgContext
// background gradient
let bg = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [CGColor(red: 0.227, green: 0.447, blue: 0.659, alpha: 1), CGColor(red: 0.141, green: 0.306, blue: 0.478, alpha: 1)] as CFArray, locations: [0, 1])!
ctx.drawLinearGradient(bg, start: CGPoint(x: 0, y: S), end: CGPoint(x: S, y: 0), options: [])
// scale drawing around the centre
let k = 1 - 2 * pad
ctx.translateBy(x: S / 2, y: S / 2); ctx.scaleBy(x: k, y: k); ctx.translateBy(x: -S / 2, y: -S / 2)
// shield
let sh = CGMutablePath()
sh.move(to: CGPoint(x: 512, y: 850))
sh.addCurve(to: CGPoint(x: 250, y: 560), control1: CGPoint(x: 380, y: 790), control2: CGPoint(x: 250, y: 700))
sh.addLine(to: CGPoint(x: 250, y: 300))
sh.addLine(to: CGPoint(x: 512, y: 200))
sh.addLine(to: CGPoint(x: 774, y: 300))
sh.addLine(to: CGPoint(x: 774, y: 560))
sh.addCurve(to: CGPoint(x: 512, y: 850), control1: CGPoint(x: 774, y: 700), control2: CGPoint(x: 644, y: 790))
sh.closeSubpath()
// flip: CoreGraphics origin is bottom-left, the path above is drawn top-down
ctx.saveGState(); ctx.translateBy(x: 0, y: S); ctx.scaleBy(x: 1, y: -1)
ctx.addPath(sh); ctx.setFillColor(CGColor(red: 0.96, green: 0.976, blue: 0.992, alpha: 1)); ctx.fillPath()
// check mark
ctx.setStrokeColor(CGColor(red: 0.184, green: 0.392, blue: 0.592, alpha: 1)); ctx.setLineWidth(64); ctx.setLineCap(.round); ctx.setLineJoin(.round)
ctx.move(to: CGPoint(x: 395, y: 500)); ctx.addLine(to: CGPoint(x: 480, y: 590)); ctx.addLine(to: CGPoint(x: 640, y: 405)); ctx.strokePath()
ctx.restoreGState()
// "sr" mark
let para = NSMutableParagraphStyle(); para.alignment = .center
let attrs: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 92, weight: .bold), .foregroundColor: NSColor(red: 0.749, green: 0.863, blue: 0.961, alpha: 1), .paragraphStyle: para]
("sr" as NSString).draw(in: CGRect(x: 0, y: 52, width: S, height: 120), withAttributes: attrs)
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
