export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">オフラインです</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        電波が回復すると自動的に元の画面が表示されます。現金入力はオフラインのままでも記録でき、復帰時に自動で同期されます。
      </p>
    </main>
  );
}
