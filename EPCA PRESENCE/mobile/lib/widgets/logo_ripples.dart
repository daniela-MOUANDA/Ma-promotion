import 'package:flutter/material.dart';

import '../theme.dart';

class LogoRipples extends StatefulWidget {
  const LogoRipples({super.key, this.color = EpcaColors.fluo});

  final Color color;

  @override
  State<LogoRipples> createState() => _LogoRipplesState();
}

class _LogoRipplesState extends State<LogoRipples> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return CustomPaint(
            painter: _RipplePainter(progress: _controller.value, color: widget.color),
            child: const SizedBox.expand(),
          );
        },
      ),
    );
  }
}

class _RipplePainter extends CustomPainter {
  _RipplePainter({required this.progress, required this.color});

  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.shortestSide * 0.48;
    const rings = 3;

    for (var i = 0; i < rings; i++) {
      final t = (progress + i / rings) % 1.0;
      final radius = 54 + t * maxRadius;
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = (3.4 * (1 - t)).clamp(0.7, 3.4)
        ..color = color.withValues(alpha: (1 - t) * 0.52);
      canvas.drawCircle(center, radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _RipplePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}
