// PostCSS pipeline: Tailwind CSS v3.
// (autoprefixer is not wired in: no browserslist config; Tailwind v3's own
// output + modern browsers is the target. Parking autoprefixer on the
// off-stack sign-off card t_7480ddbe - it is NOT required for this build.)
export default {
  plugins: {
    tailwindcss: {},
  },
}
