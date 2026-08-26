import {
  createContext,
  type CSSProperties,
  type DragEvent,
  type PropsWithChildren,
  type RefObject,
  useContext,
  useMemo,
  useRef,
} from "react";

type ScreenPortalContextValue = {
  screenRef: RefObject<HTMLDivElement | null>;
};

const ScreenPortalContext = createContext<ScreenPortalContextValue | null>(null);

function suppressNativeDrag(event: DragEvent<HTMLElement>) {
  if (event.target instanceof Element && event.target.closest('[data-native-drag="true"]')) {
    return;
  }

  event.preventDefault();
}

export function useScreenPortal() {
  const context = useContext(ScreenPortalContext);

  if (!context) {
    throw new Error("useScreenPortal must be used inside PhoneFrame");
  }

  return context;
}

export function PhoneFrame({ children }: PropsWithChildren) {
  const screenRef = useRef<HTMLDivElement | null>(null);
  const contextValue = useMemo(() => ({ screenRef }), []);

  return (
    <ScreenPortalContext.Provider value={contextValue}>
      <div className="web-stage" onDragStartCapture={suppressNativeDrag}>
        <div
          ref={screenRef}
          className="web-screen"
          data-testid="web-screen"
          style={{ "--device-safe-area-bottom": "0px" } as CSSProperties}
        >
          {children}
        </div>
      </div>
    </ScreenPortalContext.Provider>
  );
}
