import { ActionButtonBase } from "./ActionButtonBase.js";

/*
 * Prop contract: lower-emphasis action button for secondary flows and inline actions.
 * Accepts label, onPress, disabled, hint, leadingAccessory, trailingAccessory, children, testID, and style.
 */
export function SecondaryActionButton(props) {
  return ActionButtonBase({
    ...props,
    variant: "secondary"
  });
}
