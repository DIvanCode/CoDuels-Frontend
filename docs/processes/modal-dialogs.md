# Modal dialogs

## Current behavior

`shared/ui` exports `Modal`, `ModalText`, and `ModalActions`. `Modal` owns the
overlay, title, close icon, dialog semantics, focus trap, focus restoration,
Escape handling, and overlay dismissal. The shared text and actions components
provide consistent typography and button spacing. Form fields, errors, and
business actions remain in their owning feature or page.

Use the same composition for confirmations, results, notices, and forms:

```tsx
<Modal title="Подтверждение" onClose={handleClose}>
    <ModalText>Продолжить действие?</ModalText>
    <ModalActions>
        <Button variant="outlined" onClick={handleClose}>
            Отмена
        </Button>
        <Button onClick={handleConfirm}>Продолжить</Button>
    </ModalActions>
</Modal>
```

`ModalActions` may also be placed inside a `<form>` so its submit button keeps
native form behavior. `align="center"` centers a single action; `grow` lets
actions share the available width. `ModalText align="start"` supports longer
copy. `Modal size="wide" contentAlign="start"` supports configuration forms.

Closing uses `onClose` through the icon, Escape, and (by default) overlay click.
`closeOnOverlay={false}` preserves confirmation flows that should not close on
background click. `showCloseButton={false}` and `closeOnEscape={false}` are used
for the reconnecting notice. The owner decides whether closing resets a form or
only hides the dialog. `DuelConfigurationManager` uses the shared shell inside
its existing portal, so nested configuration forms retain their stacking order.

## Verification

Check a confirmation, a form with submit and cancel, the connection interruption
notice, and the configuration editor at desktop and mobile widths. Verify the
close icon, Escape, overlay click, keyboard focus, and that form state resets or
survives exactly as each owner expects.
