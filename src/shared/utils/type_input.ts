export const type_input = (type: string | undefined) => {
    switch (type) {
        case 'number':
        case 'numeric':
        case 'integer':
        case 'float':
            return 'number';
        case 'date':
            return 'date';
        default:
            return 'text';
    }
}