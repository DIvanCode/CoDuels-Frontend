interface DismissibleLayerRegistration {
    isTopmost: () => boolean;
    unregister: () => void;
}

export const createDismissibleLayerStack = () => {
    const layers: symbol[] = [];

    return {
        register(): DismissibleLayerRegistration {
            const layerId = Symbol("dismissible-layer");
            let isRegistered = true;
            layers.push(layerId);

            return {
                isTopmost: () => isRegistered && layers[layers.length - 1] === layerId,
                unregister: () => {
                    if (!isRegistered) return;
                    isRegistered = false;

                    const index = layers.lastIndexOf(layerId);
                    if (index !== -1) {
                        layers.splice(index, 1);
                    }
                },
            };
        },
    };
};

const dismissibleLayerStack = createDismissibleLayerStack();

export const registerDismissibleLayer = () => dismissibleLayerStack.register();
