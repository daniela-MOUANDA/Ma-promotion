import 'package:flutter/material.dart';

class ColoredIcon extends StatelessWidget {
  const ColoredIcon({
    super.key,
    required this.icon,
    required this.color,
    this.size = 18,
    this.box = 36,
  });

  final IconData icon;
  final Color color;
  final double size;
  final double box;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: box,
      height: box,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: size, color: color),
    );
  }
}
