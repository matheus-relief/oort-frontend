import { Component, Input } from '@angular/core';
import { AvatarSize } from './enums/avatar-size.enum';
import { AvatarVariant } from './enums/avatar-variant.enum';

/**
 * UI Avatar Component
 */
@Component({
  selector: 'ui-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent {
  @Input() size: AvatarSize = AvatarSize.MEDIUM;
  @Input() icon = '';
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  @Input() action: any = () => {};
  @Input() shape: any = '';
  @Input() initials: any = '';
  @Input() variant: AvatarVariant | string = AvatarVariant.DEFAULT;

  avatarSize = AvatarSize;
  /**
   * Triggers any action given on click avatar element
   */
  triggerAvatarAction() {
    if (this.action) {
      this.action();
    }
  }
}
