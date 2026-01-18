// Type declarations for @expo/vector-icons
// This module is re-exported from expo, types are included but not always resolved
declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  import { TextStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
  }

  export const Ionicons: ComponentType<IconProps>;
  export const MaterialIcons: ComponentType<IconProps>;
  export const FontAwesome: ComponentType<IconProps>;
  export const Feather: ComponentType<IconProps>;
  export const AntDesign: ComponentType<IconProps>;
  export const Entypo: ComponentType<IconProps>;
  export const EvilIcons: ComponentType<IconProps>;
  export const Foundation: ComponentType<IconProps>;
  export const MaterialCommunityIcons: ComponentType<IconProps>;
  export const Octicons: ComponentType<IconProps>;
  export const SimpleLineIcons: ComponentType<IconProps>;
  export const Zocial: ComponentType<IconProps>;
}
