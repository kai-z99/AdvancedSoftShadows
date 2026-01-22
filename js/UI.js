(function () { //immediate function to avoid polluting global scope
    function styleInfoButton(button) {
        Object.assign(button.style, {
            padding: '2px 8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            borderRadius: '3px',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            transition: 'opacity 0.15s ease',
        });
    }

    function setButtonDisabledState(button, disabled) {
        button.disabled = disabled;
        button.style.opacity = disabled ? '0.3' : '1.0';
        button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }

    function createInfoRow(container, label, key, fields, options = {}) {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${label}:`;
        Object.assign(nameSpan.style, {
            minWidth: '110px',
            display: 'inline-block',
            whiteSpace: 'nowrap',
            flexShrink: '0',
        });

        const valueContainer = document.createElement('div');
        Object.assign(valueContainer.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: '1',
            justifyContent: 'flex-end',
        });

        const valueSpan = document.createElement('span');
        valueSpan.textContent = '...';
        if (options.valueMinWidth) {
            valueSpan.style.minWidth = options.valueMinWidth;
            valueSpan.style.display = 'inline-block';
            valueSpan.style.textAlign = 'right';
        }
        valueContainer.appendChild(valueSpan);

        row.appendChild(nameSpan);
        row.appendChild(valueContainer);

        let resetButton = null;
        if (options.reset) {
            const resetOptions = options.reset;
            resetButton = document.createElement('button');
            resetButton.textContent = resetOptions.label || 'Reset';
            styleInfoButton(resetButton);
            resetButton.addEventListener('click', (event) => {
                event.stopPropagation();
                if (typeof resetOptions.onReset === 'function') {
                    resetOptions.onReset();
                }
            });
            valueContainer.appendChild(resetButton);
        }
        container.appendChild(row);

        fields[key] = valueSpan;

        return { row, valueContainer, valueSpan, resetButton };
    }

    function createDualButtonGroup(container, onLower, onHigher, lowerLabel = '<', higherLabel = '>') {
        const wrapper = document.createElement('span');
        Object.assign(wrapper.style, {
            display: 'inline-flex',
            gap: '4px',
        });

        const lowerButton = document.createElement('button');
        lowerButton.textContent = lowerLabel;
        styleInfoButton(lowerButton);
        lowerButton.addEventListener('click', (event) => {
            event.stopPropagation();
            onLower();
        });

        const higherButton = document.createElement('button');
        higherButton.textContent = higherLabel;
        styleInfoButton(higherButton);
        higherButton.addEventListener('click', (event) => {
            event.stopPropagation();
            onHigher();
        });

        wrapper.appendChild(lowerButton);
        wrapper.appendChild(higherButton);
        container.appendChild(wrapper);

        return { lower: lowerButton, higher: higherButton };
    }

    function toBoolean(value, defaultValue) {
        return (typeof value === 'boolean') ? value : defaultValue;
    }

    function createDebugPanel({
        controls = [],
        toggles = [],
        sections = null,
    } = {}) {
        const infoElement = document.createElement('div');
        infoElement.id = 'info';
        Object.assign(infoElement.style, {
            position: 'absolute',
            top: '16px',
            left: '16px',
            padding: '10px 14px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '13px',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            borderRadius: '4px',
            textShadow: '0 0 4px #000000',
            zIndex: '10',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '260px',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
        });
        document.body.appendChild(infoElement);

        const warningElement = document.createElement('div');
        Object.assign(warningElement.style, {
            position: 'absolute',
            top: '16px',
            right: '16px',
            maxWidth: '280px',
            padding: '10px 14px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#fff',
            backgroundColor: 'rgba(165, 21, 21, 0.9)',
            borderRadius: '4px',
            textShadow: '0 0 4px rgba(0,0,0,0.7)',
            zIndex: '11',
            display: 'none',
            pointerEvents: 'auto',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.35)',
        });
        document.body.appendChild(warningElement);

        const normalizedSections = (Array.isArray(sections) && sections.length > 0)
            ? sections
            : [{ controls, toggles }];
        const fields = {};
        const controlViews = [];
        const toggleViews = [];
        normalizedSections.forEach((section, index) => {
            const sectionElement = document.createElement('div');
            Object.assign(sectionElement.style, {
                paddingTop: index === 0 ? '0' : '6px',
                marginTop: index === 0 ? '0' : '6px',
                borderTop: index === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
            });

            if (section.title) {
                const titleElement = document.createElement('div');
                titleElement.textContent = section.title;
                Object.assign(titleElement.style, {
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    letterSpacing: '0.06em',
                    marginBottom: '6px',
                    color: '#c5e3ff',
                });
                sectionElement.appendChild(titleElement);
            }

            const sectionBody = document.createElement('div');
            Object.assign(sectionBody.style, {
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
            });
            sectionElement.appendChild(sectionBody);
            infoElement.appendChild(sectionElement);

            (section.controls || []).forEach((control) => {
                const rowOptions = {};
                if (control.valueMinWidth) {
                    rowOptions.valueMinWidth = control.valueMinWidth;
                }
                if (control.onReset) {
                    rowOptions.reset = {
                        label: control.resetLabel || 'Reset',
                        onReset: () => control.onReset(),
                    };
                }
                const row = createInfoRow(
                    sectionBody,
                    control.label || control.key,
                    control.key,
                    fields,
                    rowOptions
                );
                const buttons = createDualButtonGroup(
                    row.valueContainer,
                    () => control.onLower && control.onLower(),
                    () => control.onHigher && control.onHigher()
                );
                controlViews.push({
                    control,
                    valueSpan: row.valueSpan,
                    lowerButton: buttons.lower,
                    higherButton: buttons.higher,
                    resetButton: row.resetButton,
                });
            });

            (section.toggles || []).forEach((toggle) => {
                const toggleRow = document.createElement('div');
                Object.assign(toggleRow.style, {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    marginTop: '4px',
                });
                const toggleLabel = document.createElement('span');
                toggleLabel.textContent = toggle.label || 'Toggle';
                toggleLabel.style.minWidth = '110px';
                const toggleWrapper = document.createElement('div');
                Object.assign(toggleWrapper.style, {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: '1',
                    justifyContent: 'flex-end',
                });
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                const toggleState = toggle.getState ? toggle.getState() : null;
                checkbox.checked = toggleState ? !!toggleState.checked : false;
                checkbox.addEventListener('change', (event) => {
                    event.stopPropagation();
                    if (typeof toggle.onToggle === 'function') {
                        toggle.onToggle(checkbox.checked);
                    }
                });
                toggleWrapper.appendChild(checkbox);
                toggleRow.appendChild(toggleLabel);
                toggleRow.appendChild(toggleWrapper);
                sectionBody.appendChild(toggleRow);
                toggleViews.push({ toggle, checkbox });
            });
        });

        function update(info = {}) {
            controlViews.forEach((view) => {
                if (!view.control || typeof view.control.getState !== 'function') return;
                const state = view.control.getState();
                view.valueSpan.textContent = state.valueLabel || '...';
                setButtonDisabledState(view.lowerButton, !toBoolean(state.canLower, true));
                setButtonDisabledState(view.higherButton, !toBoolean(state.canHigher, true));
                if (view.resetButton) {
                    setButtonDisabledState(view.resetButton, !toBoolean(state.canReset, false));
                }
            });
            toggleViews.forEach((view) => {
                if (!view.toggle || typeof view.toggle.getState !== 'function') return;
                const state = view.toggle.getState();
                view.checkbox.checked = state ? !!state.checked : false;
            });
        }

        function showWarning(message) {
            warningElement.textContent = message || '';
            warningElement.style.display = message ? 'block' : 'none';
        }

        function hideWarning() {
            warningElement.style.display = 'none';
        }

        return {
            element: infoElement,
            update,
            showWarning,
            hideWarning,
        };
    }

    window.createDebugPanel = createDebugPanel;
})();

function resolveValue(fnOrValue) {
    return (typeof fnOrValue === 'function') ? fnOrValue() : fnOrValue;
}

function createNumericControl({
    key,
    label,
    getValue,
    setValue,
    step,
    min,
    max,
    defaultValue,
    eps = 1e-6,
    formatValue = (value) => value.toString(),
    valueMinWidth,
}) {
    return {
        key,
        label,
        valueMinWidth,
        getState() {
            const value = getValue();
            const minValue = resolveValue(min);
            const maxValue = resolveValue(max);
            return {
                valueLabel: formatValue(value),
                canLower: value > minValue + eps,
                canHigher: value < maxValue - eps,
                canReset: typeof defaultValue !== 'undefined' ? Math.abs(value - defaultValue) >= eps : false,
            };
        },
        onLower() {
            setValue(getValue() - step);
        },
        onHigher() {
            setValue(getValue() + step);
        },
        onReset: (typeof defaultValue !== 'undefined') ? () => setValue(defaultValue) : null,
    };
}

function createDiscreteControl({
    key,
    label,
    values,
    getValue,
    setValue,
    defaultValue,
    formatValue = (value) => value.toString(),
    valueMinWidth,
}) {
    const orderedValues = values.slice();
    function getIndex() {
        const current = getValue();
        const idx = orderedValues.indexOf(current);
        return (idx === -1) ? 0 : idx;
    }
    function setByIndex(idx) {
        const clamped = Math.min(Math.max(idx, 0), orderedValues.length - 1);
        setValue(orderedValues[clamped]);
    }
    return {
        key,
        label,
        valueMinWidth,
        getState() {
            const value = getValue();
            const index = getIndex();
            return {
                valueLabel: formatValue(value),
                canLower: index > 0,
                canHigher: index < (orderedValues.length - 1),
                canReset: (typeof defaultValue !== 'undefined') ? value !== defaultValue : false,
            };
        },
        onLower() {
            setByIndex(getIndex() - 1);
        },
        onHigher() {
            setByIndex(getIndex() + 1);
        },
        onReset: (typeof defaultValue !== 'undefined') ? () => setValue(defaultValue) : null,
    };
}

function createToggleControl({
    key,
    label,
    getValue,
    setValue,
}) {
    return {
        key,
        label,
        getState() {
            return { checked: !!getValue() };
        },
        onToggle(checked) {
            setValue(checked);
        },
    };
}

function createPerformanceTracker() {
    const tracker = document.createElement('div');
    Object.assign(tracker.style, {
        position: 'absolute',
        top: '12px',
        right: '12px',
        padding: '6px 10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#f0f8ff',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        letterSpacing: '0.03em',
        pointerEvents: 'none',
        zIndex: 20,
    });
    tracker.textContent = 'FPS: -- | Frame: -- ms';
    document.body.appendChild(tracker);

    let frameCount = 0;
    let frameTimeAccum = 0;
    let lastUpdate = performance.now();

    function updateDisplay(avgFrameTime) {
        const now = performance.now();
        const elapsed = now - lastUpdate;
        if (elapsed < 250) {
            return;
        }
        const fps = frameCount > 0 ? (frameCount * 1000) / elapsed : 0;
        tracker.textContent = `FPS: ${fps.toFixed(1)} | Frame: ${avgFrameTime.toFixed(2)} ms`;
        lastUpdate = now;
        frameCount = 0;
        frameTimeAccum = 0;
    }

    return {
        trackFrame(frameDurationMs) {
            frameCount += 1;
            frameTimeAccum += frameDurationMs;
            const avgFrameTime = frameCount > 0 ? frameTimeAccum / frameCount : 0;
            updateDisplay(avgFrameTime);
        },
    };
}
