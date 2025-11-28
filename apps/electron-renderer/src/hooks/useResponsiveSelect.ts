import { useEffect, useState } from 'react';

export const useResponsiveSelect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkResponsive = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    // Initial check
    checkResponsive();

    // Add event listeners
    window.addEventListener('resize', checkResponsive);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkResponsive);
    };
  }, []);

  const getSelectProps = (baseProps: any = {}) => ({
    ...baseProps,
    isSearchable: !isMobile, // Disable search on mobile for better UX
    menuPortalTarget: isMobile ? document.body : undefined,
    menuShouldBlockScroll: isMobile,
    menuPlacement: isMobile ? 'bottom' : 'auto',
    maxMenuHeight: isMobile ? 180 : 240,
    styles: {
      ...baseProps.styles,
      menu: (base: any) => ({
        ...base,
        position: isMobile ? 'fixed' : 'absolute',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        width: isMobile ? '100vw' : 'auto',
        maxWidth: isMobile ? '100vw' : '300px',
        borderRadius: isMobile ? '8px 8px 0 0' : base.borderRadius,
        borderTop: isMobile ? '1px solid hsl(var(--border))' : 'none',
      }),
      menuList: (base: any) => ({
        ...base,
        maxHeight: isMobile ? 180 : base.maxHeight,
        padding: isMobile ? '4px 0' : base.padding,
      }),
      option: (base: any) => ({
        ...base,
        padding: isMobile ? '12px 16px' : base.padding,
        minHeight: isMobile ? '44px' : base.minHeight, // Touch target size
        fontSize: isMobile ? '16px' : base.fontSize, // Prevent zoom on iOS
      })
    }
  });

  return {
    isMobile,
    isTouch,
    getSelectProps
  };
};