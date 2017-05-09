import shutil
import os
import sys

OUTPUT_DIR = 'build/'


def get_files_except_manifest(path):
    for file in os.listdir(path):
        isFile = os.path.isfile(os.path.join(path, file))
        isNotManifest = 'manifest.json' not in file
        if isFile and isNotManifest:
            yield file


def get_js_files(path):
    return filter(lambda file: file.endswith('.js'),
                  get_files_except_manifest(path))


# Dir name should end with /
def copyover_from_extension(dir, subdir=''):
    for filename in get_files_except_manifest(dir + subdir):
        src = '%s%s%s' % (dir, subdir, filename)
        dest = '%s%s%s' % (OUTPUT_DIR, subdir, filename)
        print("[build.py] Copying %s to %s" % (src, dest))
        shutil.copyfile(src, dest)


def minify_js(dir, subdir):
    for filename in get_js_files(dir + subdir):
        src = '%s%s%s' % (dir, subdir, filename)
        dest = '%s%s%s.min' % (OUTPUT_DIR, subdir, filename)
        cmd = ("java -jar node_modules/google-closure-compiler/compiler.jar "
               "--compilation_level ADVANCED_OPTIMIZATIONS "
               "--externs chrome_externs.js "
               "--define 'DEV=false' %s > %s" % (src, dest))
        print("[build.py] %s" % (cmd))
        os.system(cmd)
        print("[build.py] Removing %s%s%s" % (OUTPUT_DIR, subdir, filename))
        os.remove('%s%s%s' % (OUTPUT_DIR, subdir, filename))

# Start
bump = False
if (len(sys.argv) == 2) and sys.argv[1].lower() == 'bump':
    bump = True

print("[build.py] Removing %s dir if it exists..." % (OUTPUT_DIR))
# Remove build folder
if os.path.exists(OUTPUT_DIR):
    shutil.rmtree(OUTPUT_DIR)

# Create build folder
print("[build.py] Creating %s dir..." % (OUTPUT_DIR))
os.makedirs(OUTPUT_DIR)

print("[build.py] Creating nested assets/ src/ directories...")
# Create nested assets/ lib/ src/ folders
os.makedirs("%sassets" % (OUTPUT_DIR))
os.makedirs("%ssrc" % (OUTPUT_DIR))

print("[build.py] Copying over nested files...")
for subdir in ['', 'assets/', 'src/']:
    copyover_from_extension('extension/', subdir)

print("[build.py] Minifying .js files...")
for subdir in ['src/']:
    minify_js('extension/', subdir)

print("[build.py] Editing manifest.json and copying over...")
# Read in the file
with open('%smanifest.json' % ('extension/'), 'r') as manifest:
    manifest_data = manifest.read()

# Replace the target string
manifest_data = manifest_data.replace('.js', '.js.min')

# Write the file out again
with open('%smanifest.json' % (OUTPUT_DIR), 'w') as new_manifest:
    new_manifest.write(manifest_data)


print("[build.py] Packaging %s..." % (OUTPUT_DIR))
cmd = "./pack.sh bump" if bump else "./pack.sh"
os.system(cmd)
