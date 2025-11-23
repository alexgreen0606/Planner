import SwiftUI
import UIKit

struct NonBlurringTextField: UIViewRepresentable {
    @Binding var text: String
    @Binding var isFocused: Bool
    @Binding var height: CGFloat
    var onSubmit: () -> Void = {}

    // func makeUIView(context: Context) -> UITextView {
    //     let tv = UITextView()
    //     tv.delegate = context.coordinator

    //     tv.font = UIFont.systemFont(ofSize: 16)
    //     tv.backgroundColor = .clear

    //     tv.textContainer.lineBreakMode = .byWordWrapping
    //     tv.textContainer.maximumNumberOfLines = 0
    //     tv.textContainer.widthTracksTextView = true

    //     tv.isScrollEnabled = false

    //     tv.textContainerInset = .zero
    //     tv.textContainer.lineFragmentPadding = 0

    //     tv.autocorrectionType = .default
    //     tv.autocapitalizationType = .sentences

    //     tv.setContentHuggingPriority(.defaultLow, for: .horizontal)
    //     tv.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

    //     return tv
    // }

    func makeUIView(context: Context) -> UITextView {
        let textField = UITextView()
        textField.delegate = context.coordinator

        textField.isEditable = true
        textField.font = UIFont.systemFont(ofSize: 14)
        textField.isSelectable = true
        textField.backgroundColor = .clear
        textField.isUserInteractionEnabled = true
        textField.isScrollEnabled = false
        textField.textContainerInset = .zero
        textField.textContainer.lineFragmentPadding = 0

        textField.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        return textField
    }

    private func calculateHeight(
        view: UIView
    ) {
        let size = view.sizeThatFits(
            CGSize(
                width: view.frame.size.width,
                height: CGFloat.greatestFiniteMagnitude
            )
        )

        guard height != size.height else { return }
        DispatchQueue.main.async {
            height = size.height
        }
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        if uiView.text != text {
            uiView.text = text
        }

        calculateHeight(view: uiView)

        if isFocused && !uiView.isFirstResponder {
            uiView.becomeFirstResponder()
        } else if !isFocused && uiView.isFirstResponder {
            uiView.resignFirstResponder()
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    final class Coordinator: NSObject, UITextViewDelegate {
        let parent: NonBlurringTextField

        init(_ parent: NonBlurringTextField) {
            self.parent = parent
        }

        func textViewDidChange(_ textView: UITextView) {
            parent.text = textView.text ?? ""
        }

        func textViewDidBeginEditing(_ textView: UITextView) {
            parent.isFocused = true
        }

        func textViewDidEndEditing(_ textView: UITextView) {
            if !textView.isFirstResponder {
                parent.isFocused = false
            }
        }

        // Intercept return key to behave like your old onSubmit
        func textView(
            _ textView: UITextView,
            shouldChangeTextIn range: NSRange,
            replacementText replacement: String
        ) -> Bool {
            if replacement == "\n" {  // user tapped Return
                parent.onSubmit()
                return false  // don’t insert a newline
            }
            return true
        }
    }
}
