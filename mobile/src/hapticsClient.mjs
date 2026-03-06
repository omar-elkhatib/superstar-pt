import * as Haptics from "expo-haptics";

export async function triggerHaptic(hapticKind) {
  try {
    if (hapticKind === "selection") {
      await Haptics.selectionAsync();
      return true;
    }

    if (hapticKind === "success") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    }

    if (hapticKind === "error") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
