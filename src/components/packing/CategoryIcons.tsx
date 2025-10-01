import React from 'react';

const iconProps = {
    className: "h-6 w-6 text-indigo-500 dark:text-indigo-400",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.5
};

export const PassportIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M3.75 4.5a3 3 0 00-3 3v10.5a3 3 0 003 3h16.5a3 3 0 003-3V7.5a3 3 0 00-3-3H3.75z" />
        <path d="M10.5 8.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        <path d="M10.5 12a5.25 5.25 0 00-7.5 0" />
        <path d="M15 12h3.75" />
        <path d="M15 14.25h3.75" />
        <path d="M15 16.5h3.75" />
    </svg>
);

export const TShirtIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.109 1.109 0 00-.57 1.664c.369.555.035 1.287-.672 1.287h-1.558c-.707 0-1.04-.732-.672-1.287.14-.21.232-.441.232-.686a1.109 1.109 0 00-.57-1.664l-.143-.048a2.25 2.25 0 01-1.161-.886l-.51-.766c-.32-.48-.226-1.121.216-1.49l1.068-.89a1.125 1.125 0 00.405-.864v-.568a3 3 0 013-3h.093a3 3 0 013 3z" />
        <path d="M9 8.25l-1.546-.436a2.25 2.25 0 00-1.848.97l-1.93 3.428a2.25 2.25 0 00.97 2.848l2.28 1.292c.792.45 1.734-.023 1.93-1.028l.245-.918a2.25 2.25 0 00-1.631-2.48l-2.28-.692a.75.75 0 01-.582-.733l.245-2.283a.75.75 0 01.733-.582l2.28.692a2.25 2.25 0 002.48-1.631l.918-.245c1.005-.2 1.478-1.138 1.028-1.93L15 8.25" />
    </svg>
);

export const ShoeIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
      <path d="M7.5 21V10.5M14.25 21V10.5M4.5 15.75H16.5" />
      <path d="M4.5 21a2.25 2.25 0 01-2.25-2.25V12a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0118.75 12v6.75a2.25 2.25 0 01-2.25 2.25H4.5z" />
      <path d="M8.25 6.75a3.75 3.75 0 107.5 0" />
    </svg>
);

export const CosmeticIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a12 12 0 00-5.84-2.56m0 0a12 12 0 01-5.84 2.56m5.84-2.56V4.72a6 6 0 0111.68 0v1.27" />
    </svg>
);

export const PillIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const PlugIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

export const BabyIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 4.5v.008" />
    </svg>
);

export const ActivityIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M5.25 5.25a3 3 0 013-3h10.5a3 3 0 013 3v10.5a3 3 0 01-3 3H8.25a3 3 0 01-3-3V5.25z" />
        <path d="M15.75 10.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

export const BagIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h-1.5m1.5 0H3" />
        <path d="M16.5 6V4.5a2.25 2.25 0 00-2.25-2.25h-4.5A2.25 2.25 0 007.5 4.5V6m-4.5 0h13.5" />
    </svg>
);

export const DefaultIcon = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round" >
        <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path d="M6 6h.008v.008H6V6z" />
    </svg>
);