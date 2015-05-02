// Should not compile.
// Error: :8:17: Unexpected token ;

class A {}

class ImproperSuper extends A {
  method() {
    return super;
  }
}

