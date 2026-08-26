import { useEffect, type PropsWithChildren } from "react";
import { MobileDeviceProvider } from "./Device";
import { KeyboardProvider, useKeyboard } from "./Keyboard";
import { PhoneFrame } from "./PhoneFrame";

export function MobileRuntime({ children }: PropsWithChildren) {
  return (
    <MobileDeviceProvider>
      <PhoneFrame>
        <KeyboardProvider>
          <KeyboardPreview />
          <MobileAppViewport>{children}</MobileAppViewport>
        </KeyboardProvider>
      </PhoneFrame>
    </MobileDeviceProvider>
  );
}

function MobileAppViewport({ children }: PropsWithChildren) {
  const keyboard = useKeyboard();

  return (
    <div
      className="mobile-app-viewport"
      data-keyboard-visible={keyboard.visible ? "true" : "false"}
      data-platform="web"
      data-testid="mobile-app-viewport"
    >
      {children}
    </div>
  );
}

function KeyboardPreview() {
  const keyboard = useKeyboard();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("keyboard") === "1") {
      keyboard.show();
    }
  }, [keyboard]);

  return null;
}
