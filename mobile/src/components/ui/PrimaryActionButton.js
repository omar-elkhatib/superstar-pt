import { ActionButtonBase } from "./ActionButtonBase.js";

/*
 * Prop contract: prominent filled action button for primary screen actions.
 * Accepts label, onPress, disabled, hint, leadingAccessory, trailingAccessory, children, testID, and style.
 */
export function PrimaryActionButton(props) {
  return ActionButtonBase({
    ...props,
    variant: "primary"
  });
}
