import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';

import '../providers/providers.dart';

class PinLockOverlay extends ConsumerStatefulWidget {
  const PinLockOverlay({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<PinLockOverlay> createState() => _PinLockOverlayState();
}

class _PinLockOverlayState extends ConsumerState<PinLockOverlay>
    with WidgetsBindingObserver {
  final _pinController = TextEditingController();
  String _error = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pinController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      ref.read(pinLockProvider.notifier).lock();
    }
  }

  Future<void> _tryBiometric() async {
    final pinState = ref.read(pinLockProvider);
    if (!pinState.biometricEnabled) return;

    final auth = LocalAuthentication();
    final can = await auth.canCheckBiometrics;
    if (!can) return;

    final ok = await auth.authenticate(
      localizedReason: 'Unlock BethVerse',
      options: const AuthenticationOptions(biometricOnly: true),
    );
    if (ok && mounted) {
      ref.read(pinLockProvider.notifier).unlock();
    }
  }

  void _submitPin() {
    final pinState = ref.read(pinLockProvider);
    if (_pinController.text == pinState.pin) {
      ref.read(pinLockProvider.notifier).unlock();
      _pinController.clear();
      setState(() => _error = '');
    } else {
      setState(() => _error = 'Incorrect PIN');
      _pinController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final pinState = ref.watch(pinLockProvider);
    final showLock = pinState.pin != null && pinState.isLocked;

    if (!showLock) {
      return widget.child;
    }

    return Stack(
      children: [
        widget.child,
        Positioned.fill(
          child: Material(
            color: Theme.of(context).scaffoldBackgroundColor,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.lock_outline,
                      size: 48,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Enter PIN',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _pinController,
                      keyboardType: TextInputType.number,
                      obscureText: true,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      decoration: InputDecoration(
                        counterText: '',
                        errorText: _error.isEmpty ? null : _error,
                      ),
                      onSubmitted: (_) => _submitPin(),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _submitPin,
                      child: const Text('Unlock'),
                    ),
                    if (pinState.biometricEnabled) ...[
                      const SizedBox(height: 12),
                      TextButton.icon(
                        onPressed: _tryBiometric,
                        icon: const Icon(Icons.fingerprint),
                        label: const Text('Use biometrics'),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
