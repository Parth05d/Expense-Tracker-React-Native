import React from 'react';
import { Image, View, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { User } from 'lucide-react-native';

interface AvatarImageProps {
  url?: string;
  size?: number;
  style?: ImageStyle | ViewStyle;
  fallbackColor?: string;
  iconColor?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  url,
  size = 40,
  style,
  fallbackColor = '#10B981',
  iconColor = '#FFFFFF',
}) => {
  if (!url) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: fallbackColor }, style]}>
        <User size={size * 0.5} color={iconColor} />
      </View>
    );
  }

  if (url.trim().startsWith('<svg') || url.includes('<svg')) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
        <SvgXml xml={url} width="100%" height="100%" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style as ImageStyle]}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AvatarImage;
