
(function() {
    'use strict';

    
    let touchTimeout = null;
    let isLongPress = false;

    
    function bloquearElemento(el) {
        if (!el || el._bloqueado) return;
        
       
        el.draggable = false;
   
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        el.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
        
        el._bloqueado = true;
    }

    function bloquearTodo() {
        
        document.querySelectorAll('img:not([data-bloqueado]), video:not([data-bloqueado])').forEach(bloquearElemento);
        
       
        document.querySelectorAll('[style*="background-image"], [style*="background-url"]').forEach(el => {
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        });
    }


    document.addEventListener('contextmenu', (e) => {
  
        let target = e.target;
        while (target && target !== document.body) {
            if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || 
                target.classList?.contains('sidebar-nav-item') ||
                target.closest?.('img') || target.closest?.('video')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            target = target.parentElement;
        }
    }, { capture: true });


    document.addEventListener('touchstart', (e) => {
 
        let target = e.target;
        let esImagenOVideo = false;
        
        while (target && target !== document.body) {
            if (target.tagName === 'IMG' || target.tagName === 'VIDEO' ||
                target.closest?.('img') || target.closest?.('video')) {
                esImagenOVideo = true;
                break;
            }
            target = target.parentElement;
        }
        
        if (esImagenOVideo) {
            touchTimeout = setTimeout(() => {
                isLongPress = true;
                e.preventDefault();
            }, 500);
        }
    }, { passive: false });

    document.addEventListener('touchmove', () => {
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }
    });

    document.addEventListener('touchend', (e) => {
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }
        if (isLongPress) {
            e.preventDefault();
            isLongPress = false;
        }
    });

    document.addEventListener('touchcancel', () => {
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }
        isLongPress = false;
    });


    document.querySelectorAll('img, video').forEach(el => {
        el.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
    });


    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Elemento
                        if (node.tagName === 'IMG' || node.tagName === 'VIDEO') {
                            bloquearElemento(node);
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll('img, video').forEach(bloquearElemento);
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Ejecutar al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bloquearTodo);
    } else {
        bloquearTodo();
    }
    
    window.addEventListener('load', bloquearTodo);
    

    document.addEventListener('keydown', (e) => {
  
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
            e.preventDefault();
            return false;
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
            return false;
        }
    });

    console.log('%c🛡️ Protección de contenido activada (imágenes, videos, descargas)', 'color: #00ff00; font-weight: bold;');
})();
