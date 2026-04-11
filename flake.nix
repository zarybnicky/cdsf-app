{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/release-25.11";

  outputs = { nixpkgs, ... }:
    let
      allSystems = [ "x86_64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = fn:
        nixpkgs.lib.genAttrs allSystems (system:
          fn (import nixpkgs {
            inherit system;
            config = {
              allowUnfree = true;
              android_sdk.accept_license = true;
            };
          }));
    in {
      devShells = forAllSystems (pkgs:
        let
          androidComposition = pkgs.androidenv.composeAndroidPackages {
            platformVersions = [ "36" ];
            buildToolsVersions = [ "35.0.0" "36.0.0" ];

            includeNDK = true;
            ndkVersions = [ "27.1.12297006"];
            includeCmake = true;
            cmakeVersions = [ "3.22.1"];
          };

          androidSdk = androidComposition.androidsdk;
          jdk = pkgs.jdk17;
        in {
          default = pkgs.mkShell {
            packages = [ jdk androidSdk ];

            env = {
              JAVA_HOME = jdk.home;
              ANDROID_SDK_ROOT = "${androidSdk}/libexec/android-sdk";
              ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
              GRADLE_OPTS =
                "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidSdk}/libexec/android-sdk/build-tools/35.0.0/aapt2";
            };

            shellHook = ''
              export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
            '';
          };
        });
    };
}
