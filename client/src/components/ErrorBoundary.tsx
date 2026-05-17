import { Component, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * 判斷是否為瀏覽器擴充功能（翻譯、廣告攔截等）注入 DOM 導致的可恢復錯誤。
 * 這類錯誤通常是 insertBefore / removeChild 操作失敗，
 * 因為外掛在 React 管理的 DOM 樹中插入或移除了節點。
 */
function isExtensionDOMError(error: Error): boolean {
  const msg = error.message || "";
  const domErrorKeywords = [
    "insertBefore",
    "removeChild",
    "appendChild",
    "replaceChild",
    "NotFoundError",
    "HierarchyRequestError",
    "Failed to execute",
    "The node before which the new node is to be inserted is not a child",
    "is not a child of this node",
  ];
  return domErrorKeywords.some((keyword) => msg.includes(keyword));
}

export default class ErrorBoundary extends Component<Props, State> {
  private autoResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.warn("[ErrorBoundary] Caught error:", error.message);
    console.warn("[ErrorBoundary] Component stack:", info.componentStack);

    // 如果是外掛 DOM 干擾導致的錯誤，自動嘗試重置（最多 3 次）
    if (isExtensionDOMError(error) && this.state.errorCount < 3) {
      const nextCount = this.state.errorCount + 1;
      console.warn(`[ErrorBoundary] DOM extension error, auto-reset attempt ${nextCount}`);
      // 遞增延遲重置，給 React 時間清理
      this.autoResetTimer = setTimeout(() => {
        this.setState({ hasError: false, error: null, errorCount: nextCount });
      }, 150 * nextCount);
    }
  }

  componentWillUnmount() {
    if (this.autoResetTimer) clearTimeout(this.autoResetTimer);
  }

  handleReset() {
    if (this.autoResetTimer) clearTimeout(this.autoResetTimer);
    this.setState({ hasError: false, error: null, errorCount: 0 });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDOMError = this.state.error ? isExtensionDOMError(this.state.error) : false;

      return (
        <div
          className={cn(
            "min-h-screen flex flex-col items-center justify-center p-6",
            "bg-background text-foreground"
          )}
        >
          <div className="max-w-md w-full space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isDOMError ? "頁面渲染受到干擾" : "發生意外錯誤。"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isDOMError
                    ? "偵測到瀏覽器擴充功能（如翻譯、廣告攔截）干擾了頁面渲染。"
                    : "應用程式發生錯誤，請嘗試重新載入頁面。"}
                </p>
              </div>
            </div>

            {isDOMError && (
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-1">
                <p className="font-medium text-foreground mb-2">建議解決方式：</p>
                <p>1. 點擊下方「重試」按鈕</p>
                <p>2. 暫時停用翻譯擴充功能後重新整理</p>
                <p>3. 使用無痕模式開啟此頁面</p>
              </div>
            )}

            {this.state.error && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  技術細節
                </summary>
                <pre className="mt-2 p-3 bg-muted/50 rounded text-xs overflow-auto max-h-32 text-muted-foreground whitespace-break-spaces">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重試
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重新載入頁面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
