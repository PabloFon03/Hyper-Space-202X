export function TrueMod(_a, _n) {
    let moddedVal = _a;
    while (moddedVal < _n) { moddedVal += _n; }
    while (moddedVal >= _n) { moddedVal -= _n; }
    return moddedVal;
}

export function MoveTowards(_current, _target, _maxDelta) {
    if (Math.abs(_target - _current) <= _maxDelta) { return _target; }
    else { return _current + _maxDelta * Math.sign(_target - _current); }
}

export function RandomInt(_min, _max) { return _min + Math.floor(Math.random() * (_max - _min)); }

export function RandomSign() { return Math.random() < 0.5 ? -1 : 1; }