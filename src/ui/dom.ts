/**
 * Creates an element with a class and optional attributes.
 * The return type follows the tag: el("button", …) is an HTMLButtonElement.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className: string,
    attributes: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    element.className = className;
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    return element;
}
