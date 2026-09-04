"""
Lightweight pytest runner for containerized environment.
"""
import sys
import os
import inspect
import tempfile
import pathlib
import traceback

class _RaisesContext:
    def __init__(self, expected_exc):
        self.expected_exc = expected_exc
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            raise AssertionError(f"Expected exception {self.expected_exc} was not raised")
        return issubclass(exc_type, self.expected_exc)

def raises(expected_exc):
    return _RaisesContext(expected_exc)

def fixture(func):
    return func

def main():
    test_dirs = [arg for arg in sys.argv[1:] if not arg.startswith("-")]
    if not test_dirs:
        test_dirs = ["app/bie/tests"]

    total = 0
    passed = 0
    failed = 0
    errors = []

    print("============================= BIE TEST SUITE =============================")
    for test_dir in test_dirs:
        if os.path.isfile(test_dir) and test_dir.endswith(".py"):
            test_files = [test_dir]
        elif os.path.isdir(test_dir):
            test_files = [
                os.path.join(test_dir, f)
                for f in sorted(os.listdir(test_dir))
                if f.startswith("test_") and f.endswith(".py")
            ]
        else:
            continue

        for tf in test_files:
            mod_name = os.path.splitext(os.path.basename(tf))[0]
            import importlib.util
            spec = importlib.util.spec_from_file_location(mod_name, tf)
            mod = importlib.util.module_from_spec(spec)
            sys.modules[mod_name] = mod
            try:
                spec.loader.exec_module(mod)
            except Exception as e:
                failed += 1
                errors.append((f"{mod_name} import", traceback.format_exc()))
                print(f"FAILED (import error): {tf} -> {e}")
                continue

            test_funcs = [
                (name, func)
                for name, func in inspect.getmembers(mod, inspect.isfunction)
                if name.startswith("test_")
            ]

            for name, func in test_funcs:
                total += 1
                sig = inspect.signature(func)
                kwargs = {}
                tmp_dir_obj = None
                if "tmp_path" in sig.parameters:
                    tmp_dir_obj = tempfile.TemporaryDirectory()
                    kwargs["tmp_path"] = pathlib.Path(tmp_dir_obj.name)

                try:
                    func(**kwargs)
                    passed += 1
                    print(f"  PASSED: {mod_name}.{name}")
                except Exception as e:
                    failed += 1
                    errors.append((f"{mod_name}.{name}", traceback.format_exc()))
                    print(f"  FAILED: {mod_name}.{name} -> {e}")
                finally:
                    if tmp_dir_obj:
                        try:
                            tmp_dir_obj.cleanup()
                        except Exception:
                            pass

    print(f"\n==================== {passed} passed, {failed} failed in {total} tests ====================")
    if failed > 0:
        print("\nFailures:")
        for name, tb in errors:
            print(f"\n--- {name} ---")
            print(tb)
        sys.exit(1)
    else:
        print("\nALL BIE TESTS PASSED GREEN!")
        sys.exit(0)
