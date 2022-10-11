export function MoveTowards(_current, _target, _maxDelta) { 
    if (Math.abs(_target - _current) <= _maxDelta) { return _target; }
    else { return _current + _maxDelta * Math.sign(_target - _current); }
}