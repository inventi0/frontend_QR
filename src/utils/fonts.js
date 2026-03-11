export const GOOGLE_FONTS = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Lato",
    "Oswald",
    "Raleway",
    "Playfair Display",
    "Caveat",
    "Ubuntu",
    "Pacifico",
    "Lobster",
    "Comfortaa",
    "Amatic SC",
    "Russo One",
    "Rubik",
    "Jost",
    "Anton",
    "Lora"
];

export const loadGoogleFont = (fontFamily) => {
    if (!fontFamily || fontFamily === 'sans-serif' || fontFamily === 'system-ui') return Promise.resolve();

    const linkId = `google-font-${fontFamily.replace(/\s+/g, '-')}`;
    if (document.getElementById(linkId)) {
        // Already loading/loaded
        return document.fonts.load(`16px "${fontFamily}"`);
    }

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);

    return document.fonts.load(`16px "${fontFamily}"`);
};
