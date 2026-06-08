// middleware.js
export const config = {
  matcher: '/((?!api|_next/static|favicon.ico).*)', // No aplica a /api ni archivos estáticos
};

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isBot = /Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i.test(userAgent);

  const desktopDomain = 'media.baltaanay.org';
  const mobileDomain = 'app.baltaanay.org';
  const currentHost = url.hostname;

  // No redirigir a bots (para que indexen ambas versiones)
  if (isBot) return;

  // Móvil en dominio desktop → redirigir a dominio móvil
  if (isMobile && currentHost === desktopDomain) {
    url.hostname = mobileDomain;
    return Response.redirect(url.toString(), 302);
  }

  // Desktop en dominio móvil → redirigir a dominio desktop
  if (!isMobile && currentHost === mobileDomain) {
    url.hostname = desktopDomain;
    return Response.redirect(url.toString(), 302);
  }
}
