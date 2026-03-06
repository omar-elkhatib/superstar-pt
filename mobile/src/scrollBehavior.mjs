export function computeRevealScrollOffset({ targetY, topMargin = 16 }) {
  if (!Number.isFinite(targetY)) {
    return 0;
  }

  return Math.max(0, Math.round(targetY - topMargin));
}

export function computeKeyboardAwareScrollOffset({
  targetY,
  targetHeight,
  viewportHeight,
  keyboardHeight,
  currentOffset = 0,
  gap = 12
}) {
  if (
    !Number.isFinite(targetY) ||
    !Number.isFinite(targetHeight) ||
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(keyboardHeight)
  ) {
    return Math.max(0, Math.round(currentOffset || 0));
  }

  const safeCurrentOffset = Math.max(0, Number(currentOffset) || 0);
  const visibleHeight = Math.max(0, viewportHeight - keyboardHeight);
  if (visibleHeight <= 0) {
    return safeCurrentOffset;
  }

  const visibleBottom = safeCurrentOffset + visibleHeight;
  const desiredBottom = targetY + targetHeight + gap;
  if (desiredBottom <= visibleBottom) {
    return safeCurrentOffset;
  }

  return Math.max(0, Math.round(desiredBottom - visibleHeight));
}
