/**
 * The on-screen joystick's current push, shared between the DOM overlay that
 * draws it and the player that reads it each frame. x: right +, y: forward +,
 * both −1…1. A plain mutable object: no React state in the 60 fps path.
 */
export const touchStick = { x: 0, y: 0 };

export function resetTouchStick(): void {
  touchStick.x = 0;
  touchStick.y = 0;
}
